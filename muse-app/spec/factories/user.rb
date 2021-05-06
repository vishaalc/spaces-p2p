FactoryBot.define do
  factory :user do
    transient do
      password { 'test_password' }
    end

    sequence(:email) { |i| "user.#{i}@example.com" }
    encrypted_password { Argon2::Password.create(password) }
  end
end
