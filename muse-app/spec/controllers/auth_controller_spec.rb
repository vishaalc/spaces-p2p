describe AuthController, type: :controller do
  it 'loads the home page' do
    get '/'

    body = JSON.parse(response.body)

    expect(response.status).to eq 200
    expect(body['message']).to eq 'Muse App'
  end

  it 'allows users to sign up' do
    post '/sign_up', params: { email: 'test@example.com', password: 'test' }
    p User.last
    expect(User.last.email).to eq 'test@example.com'
  end

  it 'prevents duplicate users from signing up' do
    existing_user = create(:user)

    post '/sign_up', params: { email: existing_user.email, password: 'test' }

    body = JSON.parse(response.body)

    expect(response.status).to eq 409
    expect(body['message']).to eq 'A user with that email already exists'
  end

  it 'allows users to sign in with the correct password' do
    existing_user = create(:user, password: 'correct password')

    post '/sign_in', params: { email: existing_user.email, password: 'correct password' }

    body = JSON.parse(response.body)

    expect(response.status).to eq 200
    expect(body['token']).to be_present
  end

  it 'prevents users from signing in with the wrong password' do
    existing_user = create(:user, password: 'correct password')

    post '/sign_in', params: { email: existing_user.email, password: 'wrong password' }

    body = JSON.parse(response.body)

    expect(response.status).to eq 401
    expect(body['message']).to eq 'The provided username or password is incorrect'
  end

  it 'prevents users from signing in with the wrong email' do
    post '/sign_in', params: { email: 'invalid email', password: 'wrong password' }

    body = JSON.parse(response.body)

    expect(response.status).to eq 401
    expect(body['message']).to eq 'The provided username or password is incorrect'
  end
end