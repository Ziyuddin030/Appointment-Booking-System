class ApplicationController < ActionController::API
  before_action :authenticate_request!

  private

  def authenticate_request!
    header = request.headers['Authorization']
    token = header&.split(' ')&.last
    return render json: { error: 'Missing token' }, status: :unauthorized unless token

    begin
      payload = JsonWebToken.decode(token)
      @current_user = User.find_by(id: payload[:user_id])
      render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_user
    rescue StandardError => e
      render json: { error: e.message }, status: :unauthorized
    end
  end
end
