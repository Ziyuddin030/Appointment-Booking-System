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
    if user.nil?
      render json: { 
        error: 'User not found',
        message: 'Please sign up if you haven\'t created an account yet'
      }, status: :not_found
    elsif user.authenticate(params[:password])
      token = JsonWebToken.encode(user_id: user.id)
      render json: { token:, user: user.slice(:id, :name, :email) }
    else
      render json: { error: 'Invalid password' }, status: :unauthorized
    end
  end

  private

  def user_params
    params.permit(:name, :email, :password, :password_confirmation)
  end
end
