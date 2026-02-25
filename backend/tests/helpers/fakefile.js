export function fakeFile({ mimetype = "application/pdf" } = {}) {
  return {
    path: "tests/fixtures/fake.pdf", // no lo vamos a leer en integration porque mockeamos gemini
    mimetype,
    filename: "fake.pdf",
    originalname: "fake.pdf",
    size: 1234
  };
}