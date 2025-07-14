import { registerRootComponent } from 'expo';
import express from "express"; // hacer npm i expressMore actions
import cors from "cors";    // hacer npm i cors
import config from './db-config.js'
import pkg from 'pg' // hacer npm i pg
import fs from 'fs';
import App from './App';

const { Client } = pkg;
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
