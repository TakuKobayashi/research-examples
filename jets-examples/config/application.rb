Jets.application.configure do
  config.project_name = "jets-examples"
  config.api_generator = false

  # config.prewarm.enable = true # default is true
  # config.prewarm.rate = '30 minutes' # default is '30 minutes'
  # config.prewarm.concurrency = 2 # default is 2
  # config.prewarm.public_ratio = 10 # default is 10

  # config.env_extra = 2 # can also set this with JETS_ENV_EXTRA
  # config.extra_autoload_paths = []

  config.cors = true # for '*''
  # config.cors = '*.mydomain.com' # for specific domain

  config.function.timeout = 20
  # config.function.role = "arn:aws:iam::#{Jets.aws.account}:role/service-role/pre-created"
  # config.function.memory_size= 1536

  config.function.environment = {
    global_app_key1: "global_app_value1",
    global_app_key2: "global_app_value2",
  }
  # More examples:
  # config.function.dead_letter_queue = { target_arn: "arn" }
  # config.function.vpc_config = {
  #   security_group_ids: [ "sg-1", "sg-2" ],
  #   subnet_ids: [ "subnet-1", "subnet-2" ]
  # }
  # The config.function settings to the CloudFormation Lambda Function properties.
  # http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html
  # Underscored format can be used for keys to make it look more ruby-ish.
end
