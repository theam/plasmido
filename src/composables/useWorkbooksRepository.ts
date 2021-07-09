import {computed, readonly, ref} from 'vue';
import {syncEmit} from 'src/global';
import {IWorkbook} from 'src/interfaces/workbooks/IWorkbook';
import {Events} from 'src/enums/Events';
import {v4} from 'uuid';
import {WorkBookActions} from 'src/enums/WorkBookActions';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {ArtifactSchemaType, ArtifactTextFormat, IArtifact} from 'src/interfaces/workbooks/IArtifact';
import {ArtifactType} from 'src/enums/ArtifactType';
import {artifactSelectorFromArtifact} from 'src/utils/SelectorsUtils';
import {cloneDeep} from 'lodash';

const workbooks = ref([] as Array<IWorkbook>);

export default function useWorkbooksRepository() {

    const currentWorkbook = ref({
        _id: '',
        name: 'New workbook...',
        uuid: v4(),
        action: WorkBookActions.NONE,
        status: WorkBookStatus.STOPPED,
        artifacts: [] as Array<IArtifact>
    } as IWorkbook);

    const inserted = ref(false);
    const updated = ref(false);
    const currentWorkbookInitialized = ref(false);
    const currentArtifact = ref('');

    const newWorkbook = () => {
        const workbook = {
            _id: '',
            name: 'New workbook...',
            uuid: v4(),
            action: WorkBookActions.NONE,
            status: WorkBookStatus.STOPPED,
            artifacts: [] as Array<IArtifact>
        } as IWorkbook;
        Object.assign(currentWorkbook.value, workbook);
        currentWorkbookInitialized.value = true;
        return workbook;
    }

    /**
     * This method should be called only once as it's async and could load the workbooks list twice
     */
    const findAllWorkbooks = async () => {
        if (!workbooks.value || workbooks.value.length === 0) {
            const workbooksFound = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_FIND_ALL_SYNC) as Array<IWorkbook>;
            workbooks.value.length = 0;
            workbooks.value.push(...workbooksFound);
        }
    }

    const findWorkbookById = (id: string) => {
        if (id === '') {
            throw Error('Id could not be empty');
        }
        const value = workbooks.value?.find((el) => el._id === id);
        if (value !== undefined) {
            Object.assign(currentWorkbook.value, value);
            currentWorkbookInitialized.value = true;
            if (currentWorkbook.value.artifacts.length > 0) {
                currentArtifact.value = currentWorkbook.value.artifacts[0].uuid;
            }
        }
        // log error
    };

    const updateWorkbook = async (value: IWorkbook) => {
        const savedWorkbook = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_UPDATE_SYNC, value) as IWorkbook;
        const index = workbooks.value.findIndex((el) => el._id === savedWorkbook._id);
        workbooks.value[index] = savedWorkbook;
        Object.assign(currentWorkbook.value, savedWorkbook);
        updated.value = true;
        return savedWorkbook._id;
    };

    const insertWorkbook = async (value: IWorkbook) => {
        const savedWorkbook = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_INSERT_SYNC, value) as IWorkbook;
        workbooks.value.push(savedWorkbook);
        Object.assign(currentWorkbook.value, savedWorkbook);
        inserted.value = true;
        return savedWorkbook._id;
    };

    const saveWorkbook = async () => {
        resetState();
        return currentWorkbook.value._id === '' ? await insertWorkbook(currentWorkbook.value) : await updateWorkbook(currentWorkbook.value);
    }

    const initWorkbook = (id: string | null) => {
        resetState();
        id ? findWorkbookById(id) : newWorkbook();
    }

    const updateWorkbookName = (name: string) => {
        currentWorkbook.value.name = name;
    }

    const resetState = () => {
        inserted.value = false;
        updated.value = false;
        currentWorkbookInitialized.value = false;
        currentArtifact.value = '';
    }

    // artifacts methods
    const artifacts = computed(() => currentWorkbook.value?.artifacts);
    const artifactsSelector = computed(() => artifacts.value?.map(value => artifactSelectorFromArtifact(value)));

    // producers methods
    const newProducer = () => {
        return {
            uuid: v4(),
            type: ArtifactType.PRODUCER,
            name: 'New Producer...',
            brokerId: '',
            topicName: '',
            payload: '',
            schemaType: ArtifactSchemaType.AVRO,
            textFormat: ArtifactTextFormat.JSON,
            payloadSchema: '',
            repeatTimes: 1
        } as IArtifact;
    };
    const addProducer = () => {
        const item = cloneDeep(newProducer());
        currentWorkbook.value.artifacts.push(item);
        currentArtifact.value = item.uuid;
    }
    const updateProducer = (producer: IArtifact) => {
        const producerByUUID = findProducerByUUID(producer.uuid);
        Object.assign(producerByUUID, producer);
        return producerByUUID;
    };
    const findProducerByUUID = (uuid: string) => {
        return currentWorkbook.value.artifacts.find(value => value.uuid === uuid && value.type === ArtifactType.PRODUCER);
    };
    const producers = computed(() => currentWorkbook.value?.artifacts?.filter(value => value.type === ArtifactType.PRODUCER));
    const producersSelector = computed(() => producers.value?.map(value => artifactSelectorFromArtifact(value)));
    // consumer methods
    const newConsumer = () => {
        return {
            uuid: v4(),
            type: ArtifactType.CONSUMER,
            name: 'New Consumer...',
            brokerId: '',
            topicName: '',
            payload: '',
            schemaType: ArtifactSchemaType.AVRO,
            textFormat: ArtifactTextFormat.JSON,
            payloadSchema: '',
            repeatTimes: 1
        } as IArtifact;
    }
    const addConsumer = () => {
        const item = cloneDeep(newConsumer());
        currentWorkbook.value.artifacts.push(item);
        currentArtifact.value = item.uuid;
    }
    const updateConsumer = (consumer: IArtifact) => {
        const consumerByUUID = findConsumerByUUID(consumer.uuid);
        Object.assign(consumerByUUID, consumer);
        return consumerByUUID;
    }
    const findConsumerByUUID = (uuid: string) => {
        return currentWorkbook.value.artifacts.find(value => value.uuid === uuid && value.type === ArtifactType.CONSUMER);
    }
    const consumers = computed(() => currentWorkbook.value?.artifacts?.filter(value => value.type === ArtifactType.CONSUMER));
    const consumersSelector = computed(() => consumers.value?.map(value => artifactSelectorFromArtifact(value)));
    const isConsumerRunning = (artifactUUID: string, status: WorkBookStatus) => consumers.value.some(value => value.uuid === artifactUUID) && status === WorkBookStatus.RUNNING;
    const isProducerRunning = (artifactUUID: string, status: WorkBookStatus) => producers.value.some(value => value.uuid === artifactUUID) && status === WorkBookStatus.RUNNING;

    const cloneArtifact = (artifactUUID: string) => {
        const artifact = currentWorkbook.value.artifacts.find(value => value.uuid === artifactUUID);
        if (artifact) {
            const newArtifact = cloneDeep(artifact);
            newArtifact.name = newArtifact.name + ' (1)';
            newArtifact.uuid = v4();
            currentWorkbook.value.artifacts.push(newArtifact);
        }
    }

    const deleteArtifact = (artifactUUID: string) => {
        const artifactIndex = currentWorkbook.value.artifacts.findIndex(value => value.uuid === artifactUUID);
        if (artifactIndex !== -1) {
            currentWorkbook.value.artifacts.splice(artifactIndex, 1);
        }
    }

    return {
        currentWorkbook: readonly(currentWorkbook),
        workbooks: readonly(workbooks),
        inserted: readonly(inserted),
        updated: readonly(updated),
        currentArtifact,
        artifacts,
        artifactsSelector,
        producers,
        producersSelector,
        consumers,
        consumersSelector,
        initWorkbook,
        newWorkbook,
        findAllWorkbooks,
        findWorkbookById,
        saveWorkbook,
        updateWorkbookName,
        newProducer,
        addProducer,
        updateProducer,
        newConsumer,
        addConsumer,
        updateConsumer,
        isConsumerRunning,
        isProducerRunning,
        cloneArtifact,
        deleteArtifact
    };
}
