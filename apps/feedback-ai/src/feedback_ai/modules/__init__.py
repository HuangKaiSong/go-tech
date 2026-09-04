from feedback_ai.modules.base import AssistantModule, ModuleDescriptor
from feedback_ai.modules.feedback import FeedbackModule, get_feedback_settings

__all__ = ["AssistantModule", "FeedbackModule", "ModuleDescriptor", "create_modules"]


def create_modules() -> list[AssistantModule]:
    return [FeedbackModule(get_feedback_settings())]
