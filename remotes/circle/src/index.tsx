import '@portfolio/tokens/fonts/circle';
import '@portfolio/remote-runtime/runtime.css';
import './styles.css';
import { defineRemote } from '@portfolio/remote-runtime';
import { App } from './App';

export const { mount } = defineRemote({ name: 'circle', theme: 'circle', App });
