import { error } from 'console';
import BrowserWindowUtil from './browser-window.util';
import express from 'express';

const partitionId = 'TESTING_PARTITION';

// Setup local server so we not depends on network
let url = '';
beforeAll(done => {
  const app = express();
  app.get('/', (req, res) =>
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head></head>
      <body></body>
    </html>`),
  );

  const port = 52243;
  app.listen(port, () => {
    url = `http://localhost:${port}/`;
    done();
  });
});

describe('BrowserWindowUtil', () => {
  it('should return status and code', async () => {
    expect(
      await BrowserWindowUtil.runScriptOnPage(
        partitionId,
        url,
        `var a = { code: 200, status: true };
         return a`,
      ),
    ).toEqual({
      code: 200,
      status: true,
    });
  });

  it('should throw informative error', async () => {
    const fn = `throwsError`;
    const script = `${fn}()`;
    const error = `${fn} is not defined`;

    try {
      await BrowserWindowUtil.runScriptOnPage(partitionId, url, script);
      fail('no error was thrown!');
    } catch (e) {
      expect(e.message).toEqual(`Failed to run script on page: ${error}\n\nscript:\n${script}\n`);
      expect(e.stack).toEqual(`Error: ${error}`);
    }
  });
});
