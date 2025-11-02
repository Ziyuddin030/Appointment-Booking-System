class Api::AuthController < ApplicationController
  skip_before_action :authenticate_request!, only: [:signup, :login]

  def signup
    user = User.new(user_params)
    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      render json: { token:, user: user.slice(:id, :name, :email) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_content
    end
  end

  def login
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      token = JsonWebToken.encode(user_id: user.id)
      render json: { token:, user: user.slice(:id, :name, :email) }
    else
      render json: { error: 'Invalid credentials' }, status: :unauthorized
    end
  end

  private

  def user_params
    params.permit(:name, :email, :password, :password_confirmation)
  end
end
