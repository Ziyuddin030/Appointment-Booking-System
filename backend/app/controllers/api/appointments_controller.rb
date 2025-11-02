class Api::AppointmentsController < ApplicationController
  before_action :authenticate_request!, except: [:available]

  # @api {get} /api/appointments List appointments
  # @apiName GetAppointments
  # @apiGroup Appointments
  # @apiHeader {String} Authorization JWT token
  # @apiParam {Number} [page=1] Page number for pagination
  # @apiParam {Number} [per_page=10] Number of appointments per page
  # @apiSuccess {Number} page Current page number
  # @apiSuccess {Number} per_page Number of items per page
  # @apiSuccess {Number} total Total number of appointments
  # @apiSuccess {Number} total_pages Total number of pages
  # @apiSuccess {Array} appointments List of appointments
  # @apiSuccess {Number} appointments.id Appointment ID
  # @apiSuccess {String} appointments.name Client name
  # @apiSuccess {String} appointments.email Client email
  # @apiSuccess {String} appointments.phone Client phone number
  # @apiSuccess {String} appointments.reason Appointment reason
  # @apiSuccess {String} appointments.starts_at Appointment start time (ISO8601)
  def index
    render json: @current_user.appointments.paginated_list(
      page: params[:page],
      per_page: params[:per_page]
    )
  end

  # @api {get} /api/appointments/available Get available time slots
  # @apiName GetAvailableSlots
  # @apiGroup Appointments
  # @apiParam {String} [timezone=UTC] Timezone name (e.g., 'America/New_York')
  # @apiParam {String} [week_start] Start date of the week (YYYY-MM-DD format)
  # @apiSuccess {String} timezone Timezone used for the response
  # @apiSuccess {Array} slots List of available time slots
  # @apiSuccess {String} slots.starts_at Time slot start time (ISO8601)
  # @apiSuccess {Boolean} slots.available Whether the slot is available
  # @apiDescription Returns available time slots for the next 5 business days.
  # Time slots are in 30-minute intervals between 9 AM and 5 PM local time.
  # Weekends are excluded.
  def available
    render json: AppointmentService.available_slots(
      timezone: params[:timezone],
      week_start: params[:week_start]
    )
  end

  # @api {post} /api/appointments Create appointment
  # @apiName CreateAppointment
  # @apiGroup Appointments
  # @apiHeader {String} Authorization JWT token
  # @apiParam {Object} appointment Appointment object
  # @apiParam {String} appointment.starts_at Start time (ISO8601)
  # @apiParam {String} appointment.name Client name
  # @apiParam {String} appointment.email Client email
  # @apiParam {String} appointment.phone Client phone number
  # @apiParam {String} appointment.reason Reason for appointment
  # @apiSuccess {Object} appointment Created appointment object
  # @apiError {Array} errors List of validation errors
  def create
    appointment = AppointmentService.create_appointment(@current_user, appointment_params)

    if appointment.save
      render json: appointment, status: :created
    else
      render json: { errors: appointment.errors.full_messages }, 
             status: :unprocessable_content
    end
  end

  # @api {delete} /api/appointments/:id Cancel appointment
  # @apiName CancelAppointment
  # @apiGroup Appointments
  # @apiHeader {String} Authorization JWT token
  # @apiParam {Number} id Appointment ID
  # @apiSuccess {String} message Success message
  # @apiError {String} error Error message if appointment not found
  def destroy
    appt = @current_user.appointments.find_by(id: params[:id])
    return render json: { error: 'Not found' }, status: :not_found unless appt

    appt.destroy
    render json: { message: 'Cancelled' }
  end

  private

  def appointment_params
    params.require(:appointment).permit(:starts_at, :name, :email, :phone, :reason)
  end
end
