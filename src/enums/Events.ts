export enum Events {
// connected
  PLASMIDO_INPUT_ADMIN_CONNECT_SYNC = 'PLASMIDO_INPUT_ADMIN_CONNECT_SYNC',

// topics
  PLASMIDO_INPUT_TOPICS_GET_TOPICS_SYNC = 'PLASMIDO_INPUT_TOPICS_GET_TOPICS_SYNC',
  PLASMIDO_INPUT_TOPICS_GET_MEDATA_TOPICS_SYNC = 'PLASMIDO_INPUT_TOPICS_GET_METADATA_TOPICS_SYNC',
  PLASMIDO_INPUT_TOPICS_CREATE_TOPIC_SYNC = 'PLASMIDO_INPUT_TOPICS_CREATE_TOPIC_SYNC',
  PLASMIDO_INPUT_TOPICS_DELETE_TOPIC_SYNC = 'PLASMIDO_INPUT_TOPICS_DELETE_TOPIC_SYNC',

// producer
  PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT = 'PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT',

// consumer
  PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT = 'PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT',

// consumer groups
PLASMIDO_INPUT_ADMIN_LIST_GROUPS_SYNC = 'PLASMIDO_INPUT_ADMIN_LIST_GROUPS_SYNC',
PLASMIDO_INPUT_ADMIN_DELETE_GROUPS_SYNC = 'PLASMIDO_INPUT_ADMIN_DELETE_GROUPS_SYNC',

// Confluent Schema Registry
  PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_INSERT_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_INSERT_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_UPDATE_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_UPDATE_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_CONNECT_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_CONNECT_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SUBJECTS_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SUBJECTS_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SCHEMAS_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SCHEMAS_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_SAVE_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_SAVE_SYNC',
  PLASMIDO_INPUT_SCHEMA_REGISTRY_DELETE_SYNC = 'PLASMIDO_INPUT_SCHEMA_REGISTRY_DELETE_SYNC',

// Broker database
  PLASMIDO_INPUT_BROKER_INSERT_SYNC = 'PLASMIDO_INPUT_BROKER_INSERT_SYNC',
  PLASMIDO_INPUT_BROKER_FIND_ALL_SYNC = 'PLASMIDO_INPUT_BROKER_FIND_ALL_SYNC',
  PLASMIDO_INPUT_BROKER_UPDATE_SYNC = 'PLASMIDO_INPUT_BROKER_UPDATE_SYNC',
  PLASMIDO_INPUT_BROKER_DELETE_SYNC = 'PLASMIDO_INPUT_BROKER_DELETE_SYNC',

// User database
  PLASMIDO_INPUT_USER_INSERT_SYNC = 'PLASMIDO_INPUT_USER_INSERT_SYNC',
  PLASMIDO_INPUT_USER_FIND_ALL_SYNC = 'PLASMIDO_INPUT_USER_FIND_ALL_SYNC',
  PLASMIDO_INPUT_USER_UPDATE_SYNC = 'PLASMIDO_INPUT_USER_UPDATE_SYNC',
  PLASMIDO_INPUT_USER_DELETE_SYNC = 'PLASMIDO_INPUT_USER_DELETE_SYNC',

// Environment database
  PLASMIDO_INPUT_ENVIRONMENT_INSERT_SYNC = 'PLASMIDO_INPUT_ENVIRONMENT_INSERT_SYNC',
  PLASMIDO_INPUT_ENVIRONMENT_FIND_ALL_SYNC = 'PLASMIDO_INPUT_ENVIRONMENT_FIND_ALL_SYNC',
  PLASMIDO_INPUT_ENVIRONMENT_UPDATE_SYNC = 'PLASMIDO_INPUT_ENVIRONMENT_UPDATE_SYNC',
  PLASMIDO_INPUT_ENVIRONMENT_DELETE_SYNC = 'PLASMIDO_INPUT_ENVIRONMENT_DELETE_SYNC',

// Workbooks
  PLASMIDO_INPUT_WORKBOOK_INSERT_SYNC = 'PLASMIDO_INPUT_WORKBOOK_INSERT_SYNC',
  PLASMIDO_INPUT_WORKBOOK_FIND_ALL_SYNC = 'PLASMIDO_INPUT_WORKBOOK_FIND_ALL_SYNC',
  PLASMIDO_INPUT_WORKBOOK_UPDATE_SYNC = 'PLASMIDO_INPUT_WORKBOOK_UPDATE_SYNC',
  PLASMIDO_INPUT_WORKBOOK_DELETE_SYNC = 'PLASMIDO_INPUT_WORKBOOK_DELETE_SYNC',
  PLASMIDO_INPUT_WORKBOOK_START_SYNC = 'PLASMIDO_INPUT_WORKBOOK_START_SYNC',
  PLASMIDO_INPUT_WORKBOOK_STOP_SYNC = 'PLASMIDO_INPUT_WORKBOOK_STOP_SYNC',
  PLASMIDO_OUTPUT_WORKBOOK_STARTED = 'PLASMIDO_OUTPUT_WORKBOOK_STARTED',
  PLASMIDO_OUTPUT_WORKBOOK_STOPPED = 'PLASMIDO_OUTPUT_WORKBOOK_STOPPED',

  PLASMIDO_INPUT_EXECUTIONS_TRUNCATE = 'PLASMIDO_INPUT_EXECUTIONS_TRUNCATE',
  PLASMIDO_INPUT_EXECUTIONS_CONSUMED_COUNT = 'PLASMIDO_INPUT_EXECUTIONS_CONSUMED_COUNT',
  PLASMIDO_INPUT_EXECUTIONS_CONSUMED = 'PLASMIDO_INPUT_EXECUTIONS_CONSUMED',
}
