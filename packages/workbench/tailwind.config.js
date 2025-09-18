const path = require('path')

module.exports = {
  content: [
    path.resolve(__dirname, './index.html'),
    path.resolve(__dirname, './src/**/*.{ts,tsx,js,jsx}'),
    path.resolve(process.cwd(), './steps/**/*.{tsx,jsx}'),
  ],
}
