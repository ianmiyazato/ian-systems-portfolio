import '@portfolio/tokens/fonts/balcao';
import '@portfolio/remote-runtime/runtime.css';
import './styles.css';
import { defineRemote } from '@portfolio/remote-runtime';
import { App } from './App';

export const { mount } = defineRemote({ name: 'balcao', theme: 'balcao', App });
