<?php
// Check if the form was submitted
if (isset($_POST['submit'])) {

    // 1. Configure upload directory
    $targetDir = "uploads/";

    // Create the folder if it doesn't exist
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // 2. Count total files selected
    $countfiles = count($_FILES['my_files']['name']);
    
    // 3. Loop through each file
    for ($i = 0; $i < $countfiles; $i++) {
        
        $filename = $_FILES['my_files']['name'][$i];
        
        // Construct the full path
        $targetFilePath = $targetDir . basename($filename);

        // check if file has a name (avoids empty upload attempts)
        if (!empty($filename)) {
            // 4. Move the file from temporary storage to our folder
            if (move_uploaded_file($_FILES['my_files']['tmp_name'][$i], $targetFilePath)) {
                echo "File <strong>" . htmlspecialchars($filename) . "</strong> uploaded successfully.<br>";
            } else {
                echo "Error uploading " . htmlspecialchars($filename) . ".<br>";
            }
        }
    }
    
    echo "<br><a href='upload_form.html'>Upload more files</a>";

} else {
    echo "No files submitted.";
}
?>