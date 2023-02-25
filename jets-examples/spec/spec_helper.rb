ENV["JETS_ENV"] ||= "test"
ENV["TEST"] = "1"
abort("The Jets environment is running in production mode!") if Jets::Config.env == "production"

require "pp"
require "byebug"
require "fileutils"

require "jets"
Jets.boot

require 'capybara/rspec'
Capybara.app = Jets.application
# Capybara.current_driver = :selenium
# Capybara.app_host = 'http://localhost:8888'


module Helpers
  def payload(name)
    JSON.load(IO.read("spec/fixtures/payloads/#{name}.json"))
  end
end

RSpec.configure do |c|
  c.include Helpers
end
