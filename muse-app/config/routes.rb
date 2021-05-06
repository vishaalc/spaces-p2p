Jets.application.routes.draw do
  get '/', to: 'auth#index'
  post 'sign_up', to: 'auth#sign_up'
  post 'sign_in', to: 'auth#sign_in'
end
