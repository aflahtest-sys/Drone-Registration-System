const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = async (registration) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `registration-${registration._id}-${Date.now()}.pdf`;
      const filePath = path.join('pdfs', fileName);

      // Create PDFs directory if it doesn't exist
      if (!fs.existsSync('pdfs')) {
        fs.mkdirSync('pdfs');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40
      });

      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('DRONE REGISTRATION CERTIFICATE', {
        align: 'center'
      });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Registration Date: ' + new Date().toLocaleDateString(), {
        align: 'center'
      });

      doc.moveDown(1.5);

      // Customer Information Section
      doc.fontSize(14).font('Helvetica-Bold').text('CUSTOMER INFORMATION', {
        underline: true
      });

      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${registration.customerName}`);
      doc.text(`ID Number: ${registration.idNumber}`);
      doc.text(`ID Expiry Date: ${new Date(registration.idExpiryDate).toLocaleDateString()}`);
      doc.text(`Phone Number: ${registration.phoneNumber || 'N/A'}`);

      doc.moveDown(1.5);

      // Drone Information Section
      doc.fontSize(14).font('Helvetica-Bold').text('DRONE INFORMATION', {
        underline: true
      });

      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Drone Model: ${registration.droneModel}`);
      doc.text(`Serial Number: ${registration.droneSerialNumber}`);

      doc.moveDown(1.5);

      // Extracted Data Section (if available)
      if (registration.extractedIdData || registration.extractedDroneData) {
        doc.fontSize(14).font('Helvetica-Bold').text('EXTRACTED DATA (from OCR)', {
          underline: true
        });

        if (registration.extractedIdData) {
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text('From ID Card:', { underline: true });
          doc.fontSize(10);
          if (registration.extractedIdData.name) {
            doc.text(`  Name: ${registration.extractedIdData.name}`);
          }
          if (registration.extractedIdData.idNumber) {
            doc.text(`  ID Number: ${registration.extractedIdData.idNumber}`);
          }
          if (registration.extractedIdData.expiryDate) {
            doc.text(`  Expiry Date: ${registration.extractedIdData.expiryDate}`);
          }
        }

        if (registration.extractedDroneData) {
          doc.moveDown(0.3);
          doc.fontSize(11).font('Helvetica').text('From Drone Box:', { underline: true });
          doc.fontSize(10);
          if (registration.extractedDroneData.serialNumber) {
            doc.text(`  Serial Number: ${registration.extractedDroneData.serialNumber}`);
          }
          if (registration.extractedDroneData.model) {
            doc.text(`  Model: ${registration.extractedDroneData.model}`);
          }
        }

        doc.moveDown(1.5);
      }

      // Photos Section
      if (registration.idPhotoBase64 || registration.dronePhotoBase64) {
        doc.fontSize(14).font('Helvetica-Bold').text('ATTACHED PHOTOS', {
          underline: true
        });

        if (registration.idPhotoBase64) {
          doc.moveDown(0.5);
          doc.fontSize(11).font('Helvetica').text('ID Card Photo:');
          try {
            const imageBuffer = Buffer.from(registration.idPhotoBase64, 'base64');
            doc.image(imageBuffer, 50, doc.y, { width: 200 });
            doc.moveDown(2.5);
          } catch (err) {
            doc.text('[Photo could not be embedded]');
          }
        }

        if (registration.dronePhotoBase64) {
          doc.fontSize(11).font('Helvetica').text('Drone Box Photo:');
          try {
            const imageBuffer = Buffer.from(registration.dronePhotoBase64, 'base64');
            doc.image(imageBuffer, 50, doc.y, { width: 200 });
            doc.moveDown(2.5);
          } catch (err) {
            doc.text('[Photo could not be embedded]');
          }
        }
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica').text('This is an official registration document. Registration ID: ' + registration._id, {
        align: 'center'
      });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePDF };
