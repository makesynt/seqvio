import React from 'react';
import { InfographicResponsiveValidation, infographicResponsiveMeta } from './infographic-responsive-validation-shared';
export default function Validation() { return <InfographicResponsiveValidation width={1280} height={720} id="infographic-responsive-16x9" />; }
export const meta = infographicResponsiveMeta(1280, 720);
