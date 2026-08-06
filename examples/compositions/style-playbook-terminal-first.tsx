import React from 'react';
import { StylePlaybookValidation, stylePlaybookMeta, terminalFirst } from './style-playbook-validation-shared';
export default function Validation() { return <StylePlaybookValidation profile={terminalFirst} />; }
export const meta = stylePlaybookMeta;
