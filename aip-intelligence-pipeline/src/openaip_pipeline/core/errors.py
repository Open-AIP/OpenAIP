class PipelineError(Exception):
    pass


class ConfigurationError(PipelineError):
    pass


class ExternalServiceError(PipelineError):
    pass

