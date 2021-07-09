import {readonly, ref} from 'vue';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import {syncEmit} from 'src/global';
import {Events} from 'src/enums/Events';
import {SchemaRegistry} from '@plasmido/plasmido-schema-registry';
import {AvroSchema, ExtendedAvroSchema, Schema} from '@plasmido/plasmido-schema-registry/dist/@types';

const schemas = ref([] as Array<ExtendedAvroSchema>);

export default function useSchemaRegistry() {
  const connecting = ref(false);
  const connected = ref(false);
  const schemaInserted = ref(false);
  const connectingSchemaRegistryError = ref(false);
  const searchingSchemas = ref(false);

  const connect = async (registry: ISchemaRegistry) => {
    resetConnection();
    connecting.value = true;
    const schemaRegistry = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_CONNECT_SYNC, registry) as SchemaRegistry;
    connected.value = schemaRegistry !== null;
    connectingSchemaRegistryError.value = schemaRegistry === null;
    connecting.value = false;
    return registry;
  };

  const getSchemas = async (registry: ISchemaRegistry | undefined) => {
    try {
      searchingSchemas.value = true;
      if (!registry) {
        return;
      }
      schemas.value.length = 0;
      const result = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SCHEMAS_SYNC, registry) as Array<ExtendedAvroSchema>;
      result.forEach(value => {
        schemas.value.push(value);
      });
    } finally {
      searchingSchemas.value = false;
    }
  };

  const isAvroSchema = (schema: AvroSchema | Schema): schema is AvroSchema => (schema as AvroSchema).name != null;
  // const isJsonSchema = (schema: JsonSchema | Schema): schema is JsonSchema => true;
  // const isProtoSchema = (schema: ProtoSchema | Schema): schema is ProtoSchema => true;

  const saveSchema = async (registry: ISchemaRegistry, subject: string, schema: string) => {
    resetConnection();

    const parameters = {
      registryInstance: registry,
      subject,
      schema
    };
    const savedSchema = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_SAVE_SYNC, parameters) as ExtendedAvroSchema;

    if (!savedSchema) {
      console.error('Could not create schema');
      // return subject; // todo error
    }
    await getSchemas(registry);

    schemaInserted.value = true;
    return savedSchema;
  };

  const resetSchemas = () => {
    schemas.value.length = 0;
  }

  const resetConnection = () => {
    connected.value = false;
    connectingSchemaRegistryError.value = false;
    connecting.value = false;
    schemaInserted.value = false;
    searchingSchemas.value = false;
  }

  return {
    connectingSchemaRegistryError: readonly(connectingSchemaRegistryError),
    connected: readonly(connected),
    connecting: readonly(connecting),
    schemas: readonly(schemas),
    schemaInserted: readonly(schemaInserted),
    searchingSchemas: readonly(searchingSchemas),
    resetConnection,
    connect,
    getSchemas,
    saveSchema,
    resetSchemas
  }
}

