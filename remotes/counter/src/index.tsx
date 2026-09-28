import '@portfolio/tokens/fonts/counter';
import '@portfolio/remote-runtime/runtime.css';
import './styles.css';
import { defineRemote } from '@portfolio/remote-runtime';
import { App } from './App';

export const { mount } = defineRemote({ name: 'counter', theme: 'counter', App });
