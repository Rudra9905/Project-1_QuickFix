package com.quickhelper.backend.service;

import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;

@Service
public class AadharService {

    public boolean validateAadharQR(MultipartFile file) {
        try {
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if (bufferedImage == null) {
                // Not an image or unsupported format
                return false;
            }

            LuminanceSource source = new BufferedImageLuminanceSource(bufferedImage);
            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));

            Map<DecodeHintType, Object> hints = new EnumMap<>(DecodeHintType.class);
            hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);

            Result result = new MultiFormatReader().decode(bitmap, hints);

            // If we get here, a QR code or barcode was found.
            // basic check: Aadhar QR codes often contain XML data or specific secure text
            // Typically "<?xml" or huge integer strings for secure QR.
            // For now, finding ANY QR code in the context of an "Aadhar Back" upload
            // is a good first validation step.
            
            String text = result.getText();
            System.out.println("QR Code Found: " + text.substring(0, Math.min(text.length(), 50)) + "...");
            
            // Basic heuristic: Secure QR usually very dense number or XML
            // We return true if extraction successful.
            return true;

        } catch (NotFoundException e) {
            // QR code not found in the image
            System.out.println("No QR code found in the image.");
            return false;
        } catch (IOException e) {
            System.err.println("Error reading image file: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("Error decoding QR: " + e.getMessage());
            return false;
        }
    }
}
