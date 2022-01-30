export interface ISubjectSelector {
  label: string,
  value: string,
  schemaId: number,
}

export const subjectToSubjectSelector = (subject: string | undefined, schemaId: number | undefined) => {
  if (subject === undefined || subject === '') return null
  return {
    label: subject,
    value: subject,
    schemaId: schemaId
  } as ISubjectSelector
}


