import React from 'react';
import { cleanTechnical, StylePlaybookValidation, stylePlaybookMeta } from './style-playbook-validation-shared';
export default function Validation() { return <StylePlaybookValidation profile={cleanTechnical} />; }
export const meta = stylePlaybookMeta;
