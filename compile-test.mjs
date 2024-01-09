import fs from "fs/promises";
// DYDI Bytes
const MAGIC_HEADER = new Uint8Array([68, 89, 68, 73]);

async function makeDydi(options) {
  const { questions, answers } = options;

  let dydi_byte_buffer = mergeByteArrays(MAGIC_HEADER);

  for (let i = 0; i < questions.length; i++) {
    const q_bytes = await getStringBytes(questions[i]);

    dydi_byte_buffer = mergeByteArrays(
      dydi_byte_buffer,
      getNumericBytes(q_bytes.byteLength),
      q_bytes
    );
  }

  dydi_byte_buffer = mergeByteArrays(dydi_byte_buffer, new Uint8Array([0, 0]));

  for (let i = 0; i < answers.length; i++) {
    const ansbytes = getAnswerBytes(answers[i].slice(1), questions.length);

    console.log("ANSWER BYTES", ansbytes);

    dydi_byte_buffer = mergeByteArrays(
      dydi_byte_buffer,
      getNumericBytes(answers[i][0]),
      ansbytes
    );
  }

  return dydi_byte_buffer;
}

function getAnswerBytes(answers, totalLength) {
  let bitoffset = 4;
  let current_byte = 0;
  let bytes = [];

  for (let i = 0; i < totalLength; i++) {
    if (typeof answers[i] === "number") {
      current_byte += answers[i] << (bitoffset * 2 - 2);
      console.log("Current bytes", current_byte);
    }

    if (bitoffset === 1) {
      bitoffset = 4;
      bytes.push(current_byte);
      current_byte = 0;
    } else {
      bitoffset--;
    }
  }

  if (totalLength % 4 !== 0) {
    bytes.push(current_byte);
  }

  console.log("Bytes", bytes);

  return new Uint8Array(bytes);
}

function mergeByteArrays(...arrs) {
  const total_butes = arrs.reduce((r, v) => r + v.byteLength, 0);
  const merged_array = new Uint8Array(total_butes);
  let offset = 0;
  for (let i = 0; i < arrs.length; i++) {
    merged_array.set(arrs[i], offset);
    offset += arrs[i].byteLength;
  }

  return merged_array;
}

const MAYBE = 3;
const YES = 2;
const NO = 1;
const UNANSWERED = 0;

async function getStringBytes(str) {
  const blob = await new Blob([str]).arrayBuffer();
  const buff = new Uint8Array(blob);
  return buff;
}

function getNumericBytes(num) {
  const arr = new ArrayBuffer(2); // an Int32 takes 4 bytes
  const view = new DataView(arr);
  view.setUint16(0, num, false); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

const curr = new Date();
const date = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));

const dydi = await makeDydi({
  questions: [
    "Did you get enough sleep 😄",
    "Are you the coolest person in the world",
    "Are you feeling sick",
    "Did you excercise",
    "Are you testing",
  ],
  answers: [
    [1, YES, YES, NO, NO, YES],
    [2, MAYBE, YES, YES, NO, MAYBE],
    [3, NO, YES, NO, YES, YES],
  ],
});

fs.writeFile("test.dydi", dydi, { encoding: "utf-8" });

console.log("Done");
