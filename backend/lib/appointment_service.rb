class AppointmentService
  class << self
    def available_slots(timezone: 'UTC', week_start: nil)
      zone = ActiveSupport::TimeZone.new(timezone.presence || 'UTC')
      start_date = parse_start_date(week_start)
      end_week = start_date + 4.days

      {
        timezone: zone.name,
        slots: generate_slots(zone, start_date, end_week)
      }
    end

    def create_appointment(user, params)
      parsed_params = process_appointment_params(params)
      appointment = user.appointments.new(parsed_params[:permitted_params])
      appointment.time_zone = parsed_params[:timezone_offset] if parsed_params[:timezone_offset]
      appointment
    end

    private

    def parse_start_date(date_string)
      date_string ? Date.parse(date_string) : 1.day.from_now.beginning_of_week(:monday).to_date
    end

    def generate_slots(zone, start_date, end_week)
      available_slots = generate_time_slots(zone, start_date, end_week)
      booked_slots = get_booked_slots(start_date, end_week)

      available_slots.map do |utc_time|
        local_display = utc_time.in_time_zone(zone)
        {
          starts_at: local_display.iso8601,
          available: !booked_slots.include?(utc_time.iso8601)
        }
      end
    end

    def generate_time_slots(zone, start_date, end_week)
      slots = []
      (start_date..end_week).each do |day|
        next if day.saturday? || day.sunday?
        add_day_slots(zone, day, slots)
      end
      slots
    end

    def add_day_slots(zone, day, slots)
      (9..16).each do |hour|
        [0, 30].each do |minute|
          local_time = zone.local(day.year, day.month, day.day, hour, minute)
          utc_time = local_time.utc
          slots << utc_time if utc_time >= Time.current.utc
        end
      end
    end

    def get_booked_slots(start_date, end_week)
      Appointment
        .between(start_date.beginning_of_day, end_week.end_of_day)
        .pluck(:starts_at)
        .map(&:iso8601)
        .to_set
    end

    def process_appointment_params(params)
      return { permitted_params: params } unless params[:starts_at].present?

      parsed_time = Time.iso8601(params[:starts_at].to_s)
      timezone_offset = parsed_time.formatted_offset
      {
        permitted_params: params.merge(starts_at: parsed_time.utc),
        timezone_offset: timezone_offset
      }
    end
  end
end