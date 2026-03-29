package com.digitalcafe.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;

/**
 * Trims incoming String values and converts empty strings to null.
 * Keeps input consistent without altering business logic.
 */
@ControllerAdvice(annotations = Controller.class)
public class InputSanitizationAdvice {

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
    }
}
