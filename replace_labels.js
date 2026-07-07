const fs = require('fs');
const path = require('path');

const replacements = [
  [/>Employee</g, '>Team Member<'],
  [/>Employees</g, '>Team Members<'],
  [/"Employee"/g, '"Team Member"'],
  [/"Employees"/g, '"Team Members"'],
  [/>Employee\s/g, '>Team Member '],
  [/>Employees\s/g, '>Team Members '],
  [/\sEmployee</g, ' Team Member<'],
  [/\sEmployees</g, ' Team Members<'],
  [/Employee Name/g, 'Team Member Name'],
  [/Employee ID/g, 'Team Member ID'],
  [/Total Employees/g, 'Total Team Members'],
  [/Employee Information/g, 'Team Member Information'],
  [/Employee Details/g, 'Team Member Details'],
  [/Employee Asset/g, 'Team Member Asset'],
  [/Employee Acknowledgement/g, 'Team Member Acknowledgement'],
  [/Active Employees/g, 'Active Team Members'],
  [/Employee Department/g, 'Team Member Department'],
  [/Employee:/g, 'Team Member:'],
  [/"Employee /g, '"Team Member '],
  [/"Employees /g, '"Team Members '],
  [/ Employee"/g, ' Team Member"'],
  [/ Employees"/g, ' Team Members"'],
  [/Employee Profile/g, 'Team Member Profile'],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (content !== newContent) {
    console.log(`Updated ${filePath}`);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir('./src');
console.log("Done.");
