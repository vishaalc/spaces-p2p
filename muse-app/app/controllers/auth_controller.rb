class AuthController < ApplicationController
  def index
    render json: { message: 'Muse App'}
  end

  def sign_up
    email = params[:email]
    password = params[:password]

    if User.exists?(email: email)
      return render status: :conflict, json: { message: 'A user with that email already exists' }
    end

    user_attributes = {
      email: email,
      encrypted_password: Argon2::Password.create(password)
    }

    User.create!(user_attributes)

    render json: { message: 'User created successfully' }
  end

  def sign_in
    email = params[:email]
    password = params[:password]

    user = User.find_by(email: email)

    if user.nil? || !Argon2::Password.verify_password(password, user.encrypted_password)
      return user_not_found
    end

    payload = {
      sub: email,
      iat: Time.now.to_i,
      exp: 1.day.from_now.to_i
    }

    token = JWT.encode(payload, ENV['SECRET_KEY_BASE'], 'HS512')

    render json: { token: token }
  end

  private

    def user_not_found
      render status: :unauthorized, json: { message: 'The provided username or password is incorrect' }
    end
end
