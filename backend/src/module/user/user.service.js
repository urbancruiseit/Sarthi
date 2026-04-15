import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../../config/mySqlDB.js";
const isPasswordCorrect = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const generateEmployeeId = async (branchId) => {
  const [branch] = await pool.query(
    "SELECT branch_code FROM branches WHERE id = ?",
    [branchId],
  );

  if (branch.length === 0) {
    throw new Error("Branch not found");
  }

  const code = branch[0].branch_code;

  const [lastEmployee] = await pool.query(
    "SELECT employeeId FROM employees WHERE branch_id = ? ORDER BY id DESC LIMIT 1",
    [branchId],
  );

  let number = 1;

  if (lastEmployee.length > 0) {
    const lastId = lastEmployee[0].employeeId;
    const lastNumber = parseInt(lastId.replace(code, ""));
    number = lastNumber + 1;
  }

  const newId = code + String(number).padStart(6, "0");

  return newId;
};

const cleanUserUpdateData = (data) => {
  const allowedFields = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "maritalStatus",
    "bloodGroup",
    "personalEmail",
    "mobile",
    "alternateNumber",
    "currentAddress",
    "currentCity",
    "currentState",
    "currentPincode",
    "permanentAddress",
    "permanentCity",
    "permanentState",
    "permanentPincode",
    "bankName",
    "accountHolderName",
    "accountNumber",
    "ifscCode",
    "branch",
    "accountType",
    "upiId",
    "education",
    "experience",
    "fatherName",
    "fatherRelation",
    "fatherContact",
    "fatherOccupation",
    "motherName",
    "motherRelation",
    "motherContact",
    "motherOccupation",
    "siblingName",
    "siblingRelation",
    "siblingContact",
    "siblingOccupation",
    "aadhaarUploaded",
    "panUploaded",
    "resumeUploaded",
    "twelthCertificateUploaded",
    "graduationCertificateUploaded",
    "passportPhotoUploaded",
    "qrCodeUploaded",
    "signatureUploaded",
    "password",
    "username",
    "role_id",
    "department_id",
    "subDepartment_id",
    "manager_id",
    "is_active",
    "refreshToken",
    "joiningDate",
    "confirmationDate",
    "employeeStatus",
    "grade",
    "noticePeriod",
    "hrManager",
    "probationTenure",
    "employmentType",
    "workLocation",
    "workShift",
    "weeklyoff",
    "ctc",
    "basicSalary",
    "shiftTiming",
    "hrPolicyAccepted",
    "commitmentDeclarationAccepted",
    "informationDeclarationAccepted",
    "status",
    "formLinkActive",
    "branchOffice_id",
    "companyName",
    "officeEmail",
    "officeNumber",
    "shortName",
    "employeeType",
  ];

  const cleanData = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      cleanData[key] = data[key];
    }
  }

  return cleanData;
};

export {
  generateTokens,
  isPasswordCorrect,
  generateEmployeeId,
  cleanUserUpdateData,
};
