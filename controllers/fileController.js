import xlsx from 'xlsx'
import fs from 'fs'

export const parseExcelFile = (req, res) => {
  try {
    const filePath = req.file.path
    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])

    // удалить файл после обработки
    fs.unlinkSync(filePath)

    res.json({ data })
  } catch (error) {
    console.error('Excel parse error:', error)
    res.status(500).json({ message: 'Ошибка при обработке Excel файла' })
  }
}
