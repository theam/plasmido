import {Socket} from 'socket.io'

import express from 'express'

import * as executionWorkbookCatalog from './nedb/execution-workbook-catalog'
import * as executionArtifactCatalog from './nedb/execution-artifact-catalog'
import * as executionConsumedCatalog from './nedb/execution-consumed-catalog'
import * as workbookCatalog from './nedb/workbook-catalog'
import * as brokerCatalog from './nedb/broker-catalog'
import * as userCatalog from './nedb/user-catalog'
import * as environmentCatalog from './nedb/environment-catalog'
import * as schemaRegistryCatalog from './nedb/schema-registry-catalog'
import * as workbookListener from './listerner/workbookRepositoryListener'
import * as brokerListener from './listerner/brokerListener'
import * as userListener from './listerner/userListener'
import * as environmentListener from './listerner/environmentListener'
import * as registryListener from './listerner/schemaRegistryListener'
import * as adminListener from './listerner/adminListener'
import * as executionListener from './listerner/executionListener'
import {getDatabasePath} from './nedb/database'


const expressApp = express()
const expressHttpServer = expressApp.listen(55150)
const corsConfiguration = {
  cors: {
    origin: 'http://localhost:55151',
    credentials: true,
    methods: ['GET', 'POST']
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const io = require('socket.io')(expressHttpServer, corsConfiguration)

const initDatabase = () => {
  const brokerPath = getDatabasePath('brokers.db')
  const userPath = getDatabasePath('users.db')
  const environmentsPath = getDatabasePath('environments.db')
  const schemaPath = getDatabasePath('schema-registry.db')
  const workbookPath = getDatabasePath('workbooks.db')
  const execArtifactPath = getDatabasePath('executions-artifact.db')
  const execWorkbookPath = getDatabasePath('executions-workbook.db')
  const execConsumedPath = getDatabasePath('executions-consumed.db')
  brokerCatalog.initBrokerDatabase(brokerPath)
  userCatalog.initUserDatabase(userPath)
  environmentCatalog.initEnvironmentDatabase(environmentsPath)
  schemaRegistryCatalog.initSchemaRegistryDatabase(schemaPath)
  workbookCatalog.initWorkbookDatabase(workbookPath)
  executionArtifactCatalog.initExecutionDatabase(execArtifactPath)
  executionWorkbookCatalog.initExecutionDatabase(execWorkbookPath)
  executionConsumedCatalog.initExecutionConsumedDatabase(execConsumedPath)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
io.sockets.on('connection', (socket: Socket) => {
  initDatabase()

  socket.on('disconnect', () => {
    console.debug(':listenToBrokerDatabase:User disconnected:', socket.id, socket)
  })

  workbookListener.listenToWorkbookRepository(socket)
  brokerListener.listenToBrokerRepository(socket)
  userListener.listenToUserRepository(socket)
  environmentListener.listenToEnvironmentRepository(socket)
  registryListener.listenToSchemaRegistryRepository(socket)
  adminListener.listenToAdminRepository(socket)
  executionListener.listenToExecution(socket, io)
})
