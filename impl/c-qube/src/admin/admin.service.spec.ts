import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import * as fs from 'fs';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check a dimension data file with no errors', async () => {
    const grammarContent = fs.readFileSync(
      './ingest/dimensions/academicyear-dimension.grammar.csv',
      'utf8',
    );
    const dataContent = fs.readFileSync(
      './ingest/dimensions/academicyear-dimension.data.csv',
      'utf8',
    );

    service.checkDimensionDataForValidationErrors(grammarContent, dataContent);
  });

  it('should check a dimension grammar file with no errors', async () => {
    const grammarContent = fs.readFileSync(
      './ingest/dimensions/academicyear-dimension.grammar.csv',
      'utf8',
    );

    service.checkDimensionGrammarForValidationErrors(grammarContent);
  });

  it('should throw with a wrong data file', () => {
    const grammarContent = fs.readFileSync(
      './ingest/programs/diksha/avgplaytime-event.grammar.csv',
      'utf8',
    );
    const dataContent = fs.readFileSync(
      './ingest/programs/diksha/avgplaytime-event.data.csv',
      'utf8',
    );
    const resp = service.checkDimensionDataForValidationErrors(
      grammarContent,
      dataContent,
    );
    expect(resp).toEqual({
      errors: [
        {
          row: 1,
          col: 0,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 1,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 2,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 3,
          errorCode: 1001,
          error: 'Missing header from grammar file: string',
        },
        {
          row: 1,
          col: 4,
          errorCode: 1001,
          error: 'Missing header from grammar file: integer',
        },
        {
          row: 1,
          col: 0,
          errorCode: 1001,
          error: 'Extra header not in grammar file: state_id',
        },
        {
          row: 1,
          col: 1,
          errorCode: 1001,
          error: 'Extra header not in grammar file: grade_diksha',
        },
        {
          row: 1,
          col: 2,
          errorCode: 1001,
          error: 'Extra header not in grammar file: subject_diksha',
        },
        {
          row: 1,
          col: 3,
          errorCode: 1001,
          error:
            'Extra header not in grammar file: avg_play_time_in_mins_on_app_and_portal',
        },
      ],
    });
    // expect(() =>
    //   service.checkDimensionDataForValidationErrors(
    //     grammarContent,
    //     dataContent,
    //   ),
    // ).toThrowError();
  });
});