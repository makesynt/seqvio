import React from 'react';
import { InfographicResponsiveValidation, infographicResponsiveMeta } from './infographic-responsive-validation-shared';
export default function Validation() { return <InfographicResponsiveValidation width={720} height={720} id="infographic-responsive-1x1" />; }
export const meta = infographicResponsiveMeta(720, 720);
