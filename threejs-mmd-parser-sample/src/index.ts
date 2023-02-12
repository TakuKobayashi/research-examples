import awsLambdaFastify from '@fastify/aws-lambda';
import fastify from 'fastify';
import { Parser } from 'mmd-parser';
import axios from 'axios';

const app = fastify();

app.get('/', async (request, reply) => {
  return { hello: 'world' };
});

app.get('/load_pmx', async (request, reply) => {
  const pmxResponse = await axios.get('https://github.com/TakuKobayashi/research-examples/raw/master/threejs-mmd-parser-sample/sample_model/PronamaChan.pmx', { responseType: 'arraybuffer' })
  const pmxBuffer = pmxResponse.data;
  const pmxArrayBuffer =  pmxBuffer.buffer.slice(pmxBuffer.byteOffset, pmxBuffer.byteOffset + pmxBuffer.byteLength);
  const parser = new Parser();
  const pmxModel = parser.parsePmx(pmxArrayBuffer);
  return pmxModel;
});

app.get('/load_vmd', async (request, reply) => {
  const vmdResponse = await axios.get('https://github.com/TakuKobayashi/research-examples/raw/master/threejs-mmd-parser-sample/sample_model/run.vmd', { responseType: 'arraybuffer' })
  const vmdBuffer = vmdResponse.data;
  const vmdArrayBuffer =  vmdBuffer.buffer.slice(vmdBuffer.byteOffset, vmdBuffer.byteOffset + vmdBuffer.byteLength);
  const parser = new Parser();
  const vmdModel = parser.parseVmd(vmdArrayBuffer);
  return vmdModel;
});


export const handler = awsLambdaFastify(app);
