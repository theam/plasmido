export interface ITopicSelector {
  label: string,
  value: string
}

export const topicToTopicSelector = (topicName: string | undefined) => {
  if (topicName === undefined || topicName === '') return null;
  return {
    label: topicName,
    value: topicName
  } as ITopicSelector;
}


