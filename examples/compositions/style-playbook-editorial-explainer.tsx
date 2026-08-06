import React from 'react';
import { editorialExplainer, StylePlaybookValidation, stylePlaybookMeta } from './style-playbook-validation-shared';
export default function Validation() { return <StylePlaybookValidation profile={editorialExplainer} />; }
export const meta = stylePlaybookMeta;
