import fs from "fs/promises";

const MAGIC_HEADER = new Uint8Array([68, 89, 68, 73]);
const JAN_1_2000 = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));

function compareBytes(v1, v2) {
  if (v1.byteLength !== v2.byteLength) {
    return false;
  }

  for (let i = 0; i < v1.byteLength; i++) {
    if (v1[i] !== v2[i]) {
      return false;
    }
  }

  return true;
}

async function parseDydi(buffer) {
  const bytes = new Uint8Array(result);
  // console.log("Bytes", bytes, compareBytes(MAGIC_HEADER, bytes.slice(0, 4)));
  const data_bytes = bytes.slice(4);
  const { offset, questions } = await parseQuestions(data_bytes);

  const answer_bytes = data_bytes.slice(offset);
  // console.log("Questions", questions);

  const answers = parseAnswers(answer_bytes, questions.length);
  console.log(
    "Answers",
    JSON.stringify(
      answers.map((v) => {
        const date = new Date(JAN_1_2000.valueOf());
        date.setDate(JAN_1_2000.getDate() + v[0]);

        return {
          date,
          questions: questions.map((q, i) => ({
            q,
            a: v[i + 1],
          })),
        };
      }),
      null,
      2
    )
  );
}

function getUInt16(bytes) {
  return (bytes[0] << 8) + bytes[1];
}

function parseAnswerDay(buffer, questionCount) {
  let date_bytes = buffer.slice(0, 2);
  let date = getUInt16(date_bytes);
  let offset = 2;

  const row = [date];
  const bytes_per_day = Math.ceil(questionCount / 4);
  const bytes_set = buffer.slice(offset, offset + bytes_per_day);
  offset += bytes_per_day;

  let byte_index = 0;
  let bit_offset = 4;
  let current_byte = bytes_set[byte_index];

  // 2-bit byte masks
  // 192 -> 11000000
  // 48  -> 00110000
  // 12  -> 00001100
  // 3   -> 00000011

  const masks = [192, 48, 12, 3];

  for (let i = 0; i < questionCount; i++) {
    const mask = masks[masks.length - bit_offset];
    const masked_bytes = current_byte & mask;
    let answer_value = masked_bytes >> (bit_offset * 2 - 2);

    // console.log("DETAILS", {
    //   bit_offset: bit_offset,
    //   byte: `${current_byte}|${current_byte.toString(2)}`,
    //   mask: `${mask}|${mask.toString(2)}`,
    //   masked_bytes: `${masked_bytes}|${masked_bytes.toString(2)}`,
    //   answer: `${answer_value}|${answer_value.toString(2)}`,
    // });

    row.push(answer_value);

    if (bit_offset === 1) {
      byte_index += 1;
      current_byte = bytes_set[byte_index];
      bit_offset = 4;
    } else {
      bit_offset -= 1;
    }
  }

  return { row, offset };
}

function parseAnswers(buffer, questionCount) {
  let answer_buffer = buffer.slice(0);

  const answers = [];

  while (answer_buffer.length > 0) {
    const { offset, row } = parseAnswerDay(answer_buffer, questionCount);
    answers.push(row);
    answer_buffer = answer_buffer.slice(offset);
  }

  return answers;
  // const answers = [];

  // for (let i = 0; i < questionCount; i++) {}

  // while (length > 0) {
  //   const question_bytes = buffer.slice(offset, offset + length);
  //   offset += length;
  //   length_bytes = buffer.slice(offset, offset + 2);
  //   length = getUInt16(length_bytes);
  //   offset += 2;

  //   questions.push(await new Blob([question_bytes]).text());
  // }

  // return { questions, offset };
}

async function parseQuestions(buffer) {
  let length_bytes = buffer.slice(0, 2);
  let length = getUInt16(length_bytes);
  let offset = 2;

  const questions = [];

  while (length > 0) {
    const question_bytes = buffer.slice(offset, offset + length);
    offset += length;
    length_bytes = buffer.slice(offset, offset + 2);
    length = getUInt16(length_bytes);
    offset += 2;

    questions.push(await new Blob([question_bytes]).text());
  }

  return { questions, offset };
}

const result = await fs.readFile("test.dydi");

parseDydi(result);
