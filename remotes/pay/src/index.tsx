import '@portfolio/tokens/fonts/pay';
import '@portfolio/remote-runtime/runtime.css';
import './styles.css';
import { defineRemote } from '@portfolio/remote-runtime';
import { App } from './App';

export const { mount } = defineRemote({ name: 'pay', theme: 'pay', App });
