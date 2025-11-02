class CreateAppointments < ActiveRecord::Migration[7.1]
  def change
    create_table :appointments do |t|
      t.datetime :starts_at
      t.string :name
      t.string :email
      t.string :phone
      t.string :reason

      t.timestamps
    end
  end
end
