const getEnumValues = (schema, path) => {
  const enumValues = schema.path(path).enumValues;
  return enumValues;
};

module.exports = getEnumValues;
