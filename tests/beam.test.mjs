import test from 'node:test';
import assert from 'node:assert/strict';
import {solveBeam,gaussianSolve} from '../beam.js';

test('analytical center deflection limit is approached',()=>{const r=solveBeam({length:6,load:18,eModulus:200,inertiaMillion:85,elements:20});const analytical=5*18000*6**4/(384*200e9*(85e-6));assert.ok(Math.abs(r.maxDeflection-analytical*1000)<0.1)});
test('beam moment is maximum near center',()=>{const r=solveBeam({length:6,load:18,eModulus:200,inertiaMillion:85,elements:20});assert.ok(r.moment[10]>r.moment[0]);assert.ok(r.moment[10]>r.moment.at(-1))});
test('increasing stiffness decreases deflection',()=>{const low=solveBeam({length:6,load:18,eModulus:70,inertiaMillion:85,elements:20});const high=solveBeam({length:6,load:18,eModulus:200,inertiaMillion:85,elements:20});assert.ok(high.maxDeflection<low.maxDeflection)});
test('Gaussian elimination solves a simple system',()=>{assert.deepEqual(gaussianSolve([[2,1],[1,3]],[5,7]),[1.6,1.8])});
