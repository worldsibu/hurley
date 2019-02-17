import * as ejs from 'ejs';
import * as fs from 'fs-extra';
import { exec } from 'shelljs';
import memFs = require('mem-fs');
import memFsEditor = require('mem-fs-editor');

export module SysWrapper {
  let d = console.log;
  /** Create a file to specific path from contents.
   * @returns Promise<void>
   */
  export function createFile(filePath: string, contents: string): Promise<void> {
    return new Promise(function (fulfilled, rejected) {
      try {
        write(filePath, contents, fulfilled);
      } catch (ex) {
        rejected(ex);
      }
    });
  }

  /**
   * Renders to disk a file from a template
   * @param filePath Destination path
   * @param contents Contents in JSON format
   * @param templatePath Location of the template
   */
  export function createFileFromTemplate(filePath: string, contents: any, templatePath: string): Promise<void | {}> {
    return renderTemplateFromFile(templatePath, contents).then((compiledContents: string) => {
      return new Promise(function (fulfilled, rejected) {
        try {
          write(filePath, compiledContents, fulfilled);
        } catch (ex) {
          rejected(ex);
        }
      });
    });
  }

  export function createFileRaw(filePath: string, contents: Buffer): Promise<void> {
    return new Promise(function (fulfilled, rejected) {
      try {
        writeBuffer(filePath, contents, fulfilled);
      } catch (ex) {
        rejected(ex);
      }
    });
  }

  /**
   * Remove based on a path.
   */
  export function removePath(filePath: string): Promise<void> {
    return remove(filePath);
  }

  /**
   * Get a file from a path.
   */
  export function getFile(filePath: string, content?: any): Promise<string> {
    return new Promise(async function (fulfilled, rejected) {
      if (content) {
        fulfilled(await renderTemplateFromFile(filePath, content));
      } else {
        const store = memFs.create();
        const editor = memFsEditor.create(store);
        try {
          let file = editor.read(filePath);
          if (!file) {
            rejected('Empty or not found file.');
          }
          fulfilled(file);
        } catch (ex) {
          rejected(ex);
        }
      }
    });
  }

  /**
   * Execs a specified file.
   * @param filePath Full file path
   * @param content Optional contents to render
   */
  export async function execFile(filePath: string,
    content?: any): Promise<void> {

    if (content) {
      let renderedFileContent = await renderTemplateFromFile(filePath, content);

      return exec(
        renderedFileContent,
        { silent: false }
      );
    } else {
      let simpleFileContent = await getFile(filePath);

      if (exec(simpleFileContent,
        { silent: false, shell: '/bin/bash' }).code !== 0) {
        console.log('Found error while running script!');
        throw new Error('Errors found in script, stopping execution');
      }
    }
  }

  export async function execContent(content: any): Promise<void> {
    if (exec(content,
      { silent: false, shell: '/bin/bash' }).code !== 0) {
      console.log('Found error while running script!');
      throw new Error('Errors found in script, stopping execution');
    }
  }

  /** Get a file from a path.
   * @returns Promise<void>
   */
  export function getFileRaw(filePath: string): Promise<Buffer> {
    return new Promise(async function (fulfilled, rejected) {
      try {
        const store = memFs.create();
        const editor = memFsEditor.create(store);

        let file = editor.read(filePath, { raw: true });
        if (!file) {
          rejected('Empty or not found file.');
        }
        fulfilled(file);
      } catch (ex) {
        rejected(ex);
      }
    });
  }

  /** Copies a file
   * @returns Promise<void>
   */
  export function copyFile(from: string, to: string): Promise<void> {
    return new Promise(function (fulfilled, rejected) {
      const store = memFs.create();
      const editor = memFsEditor.create(store);
      editor.copy(from, to);
      editor.commit([], fulfilled);
    });
  }

  /** Check if a file exists.
   * @returns Promise<boolean>
  */
  export function existsPath(filePath: string): Promise<boolean> {
    return new Promise(function (fulfilled, rejected) {
      const store = memFs.create();
      const editor = memFsEditor.create(store);
      fulfilled(editor.exists(filePath));
    });
  }

  /** Create a file in JSON format.
   * @returns Promise<void>
  */
  export function createJSON(filePath: string, contents: any): Promise<void> {
    return new Promise(function (fulfilled, rejected) {
      const store = memFs.create();
      const editor = memFsEditor.create(store);
      editor.writeJSON(filePath, contents);
      editor.commit([], fulfilled);
    });
  }

  /** Get a JSON from file sys.
   * @return Promise<any> JSON object
  */
  export function getJSON(filePath: string): Promise<any> {
    return new Promise(function (fulfilled, rejected) {
      try {
        const store = memFs.create();
        const editor = memFsEditor.create(store);
        fulfilled(editor.readJSON(filePath));
      } catch (ex) {
        rejected(ex);
      }
    });
  }

  /** Create a folder.
   * @return Promise<void>
  */
  export function createFolder(folder: string) {
    return fs.ensureDir(folder);
  }

  /** 
   * Render a new string from a disk file and contents. 
   * */
  export function renderTemplateFromFile(filePath: string, content: any): Promise<string> {
    return new Promise(async function (fulfilled, rejected) {
      const store = memFs.create();
      const editor = memFsEditor.create(store);
      let file = editor.read(filePath);
      if (!file) {
        return rejected(Error(`${filePath} does not exist.`));
      }
      fulfilled(await renderTemplateFromContent(file, content));
    });
  }

  /** Render a new string from a string template and contentes. */
  export function renderTemplateFromContent(templateContent: string, content: any): Promise<string> {
    return new Promise(function (fulfilled, rejected) {
      let renderedFile = ejs.render(templateContent, content);
      fulfilled(renderedFile);
    });
  }

  function remove(filePath: string): Promise<void> {
    return fs.remove(filePath);
  }

  function write(filePath: string, contents: string, cb: any) {
    const store = memFs.create();
    const editor = memFsEditor.create(store);
    editor.write(filePath,
      contents);
    editor.commit([], cb);
  }

  function writeBuffer(filePath: string, contents: Buffer, cb: any) {
    const store = memFs.create();
    const editor = memFsEditor.create(store);

    editor.write(filePath,
      contents);
    editor.commit([], cb);
  }

  export function enumFilesInFolder(folder: string): Promise<string[]> {
    return new Promise(function (fulfilled, rejected) {
      fs.readdir(folder, (err, files) => {
        fulfilled(files);
      });
    });
  }
}
