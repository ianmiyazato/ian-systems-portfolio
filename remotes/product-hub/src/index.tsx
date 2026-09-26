import '@portfolio/tokens/fonts/product-hub';
import '@portfolio/remote-runtime/runtime.css';
import './styles.css';
import { defineRemote } from '@portfolio/remote-runtime';
import { App } from './App';

export const { mount } = defineRemote({ name: 'product-hub', theme: 'product-hub', App });
