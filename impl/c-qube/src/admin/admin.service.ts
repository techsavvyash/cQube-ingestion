import { Injectable, Logger } from '@nestjs/common';
import { DimensionDataValidator } from '../../../../dx/cqube-spec-checker/dimension.data.validator';
import { DimensionValidator } from '../../../../dx/cqube-spec-checker/dimension.grammar.validator';
import { ValidationError } from './admin.errors';
import * as fs from 'fs';
import { EventGrammarValidator } from './validators/event-grammar.validator';
import { SingleFileValidationResponse } from './dto/response';
import { EventDataValidator } from './validators/event-data.validator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const decompress = require('decompress');
@Injectable()
export class AdminService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AdminService');
  }
  checkDimensionDataForValidationErrors(
    grammarContent: string,
    dataContent: string,
  ): SingleFileValidationResponse {
    const dimensionDataValidator = new DimensionDataValidator(
      grammarContent,
      dataContent,
    );
    const errors = dimensionDataValidator.verify();
    return {
      errors,
    };
  }

  checkDimensionGrammarForValidationErrors(
    grammarContent: string,
  ): SingleFileValidationResponse {
    const dimensionGrammarValidator = new DimensionValidator(grammarContent);

    const errors = dimensionGrammarValidator.verify();
    return {
      errors,
    };
  }

  checkEventGrammarForValidationErrors(
    grammarContent: string,
  ): SingleFileValidationResponse {
    const eventGrammarValidator = new EventGrammarValidator(grammarContent);

    const errors = eventGrammarValidator.verify();
    return {
      errors,
    };
  }

  checkEventDataForValidationErrors(
    grammarContent: string,
    dataContent: string,
  ): SingleFileValidationResponse {
    const eventDataValidator = new EventDataValidator(
      grammarContent,
      dataContent,
    );

    const errors = eventDataValidator.verify();
    return {
      errors,
    };
  }

  async handleZipFile(zipFilePath: string) {
    // unzip the file first
    const errors = {
      dimensions: {},
      programs: {},
    };

    // TODO: validate zips folder structure
    if (fs.existsSync('mount')) fs.rmdirSync('mount', { recursive: true });
    fs.mkdirSync('mount');
    const files = await decompress(zipFilePath, 'mount');
    const config = JSON.parse(files[1].data);

    errors.dimensions = this.handleDimensionFolderValidation(
      './mount/update/dimensions',
    );

    errors.programs = this.handleProgramsFolderValidation(config);
    return errors;
  }

  handleDimensionFolderValidation(folderPath: string) {
    const regexDimensionGrammar = /\-dimension\.grammar.csv$/i;
    const inputFilesForDimensions = fs.readdirSync(folderPath);

    const errors = {
      grammar: {},
      data: {},
    };

    for (let i = 0; i < inputFilesForDimensions.length; i++) {
      const grammarErrors = [];
      const dataErrors = [];

      if (regexDimensionGrammar.test(inputFilesForDimensions[i])) {
        const currentDimensionGrammarFileName =
          folderPath + `/${inputFilesForDimensions[i]}`;
        const dimensionDataFileName = currentDimensionGrammarFileName.replace(
          'grammar',
          'data',
        );

        console.log(
          'currentDimensionGrammarFileName: ',
          currentDimensionGrammarFileName,
        );

        console.log('dimensionDataFileName: ', dimensionDataFileName);

        const grammarContent = fs.readFileSync(
          currentDimensionGrammarFileName,
          'utf-8',
        );
        const dataContent = fs.readFileSync(dimensionDataFileName, 'utf-8');

        grammarErrors.push(
          ...this.checkDimensionGrammarForValidationErrors(grammarContent)
            .errors,
        );

        dataErrors.push(
          this.checkDimensionDataForValidationErrors(
            grammarContent,
            dataContent,
          ).errors,
        );
        errors.grammar[inputFilesForDimensions[i]] = grammarErrors;
        errors.data[inputFilesForDimensions[i].replace('grammar', 'data')] =
          dataErrors;
      }
    }

    return errors;
  }

  handleProgramsFolderValidation(config) {
    const regexEventGrammar = /\-event\.grammar.csv$/i;
    const errors = {
      grammar: {},
      data: {},
    };

    console.log('config: ', config);

    for (let i = 0; i < config?.programs.length; i++) {
      const inputFiles = fs.readdirSync(config?.programs[i].input?.files);
      const grammarErrors = [];
      const dataErrors = [];
      for (let j = 0; j < inputFiles.length; j++) {
        if (regexEventGrammar.test(inputFiles[j])) {
          const currentEventGrammarFileName =
            config?.programs[i].input?.files + `/${inputFiles[j]}`;
          const eventGrammarContent = fs.readFileSync(
            currentEventGrammarFileName,
            'utf-8',
          );
          const dataFilePath = currentEventGrammarFileName.replace(
            'grammar',
            'data',
          );
          const eventContent = fs.readFileSync(dataFilePath, 'utf-8');
          grammarErrors.push(
            ...this.checkEventGrammarForValidationErrors(eventGrammarContent)
              .errors,
          );
          dataErrors.push(
            ...this.checkEventDataForValidationErrors(
              eventGrammarContent,
              eventContent,
            ).errors,
          );
          errors.grammar[inputFiles[j]] = {
            eventGrammarContent,
            grammarErrors,
          };
          errors.data[inputFiles[j].replace('grammar', 'data')] = {
            eventDataContent: eventContent,
            dataErrors,
          };
        }
      }
    }

    return errors;
  }
}
