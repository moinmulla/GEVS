import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage, useFormik } from "formik";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Typography } from "@mui/material";
import _ from "lodash";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import Footer from "../components/Footer";
import axios from "../utils/axios";
import Navbar from "../components/Navbar";
import "./Register.css";

function Register() {
  const [qrdata, setqrdata] = useState(false);

  const formikRef = useRef();

  const handleqrcode = () => {
    setqrdata(true);
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(sucess, error);

    function sucess(result) {
      scanner.clear();
      setqrdata(false);
      if (formikRef.current) {
        formikRef.current.setFieldValue("uvccode", result);
      }
    }
    function error(err) {
      console.warn(err);
    }
  };

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    DOB: "",
    constituency: "",
    uvccode: "",
  };

  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    DOB: Yup.string().required("Date of birth is required"),
    constituency: Yup.string().required("Constituency is required"),
    uvccode: Yup.string()
      .required("UVC Code is required")
      .min(8, "UVC Code of 8 characters long is required")
      .max(8, "UVC Code of 8 characters long is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters long")
      .matches(/^(?=.*\d)/, "Password must contain at least one numeric digit"),
    confirmPassword: Yup.string()
      .required("Confirm Password is required")
      .oneOf([Yup.ref("password"), null], "Passwords must match"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    let name = `${values.firstName} ${values.lastName}`;
    name = _.startCase(_.toLower(name));
    values.full_name = name;
    const { confirmPassword, firstName, lastName, ...modifiedValues } = values;

    axios
      .post("http://localhost:3001/register", modifiedValues)
      .then((res) => {
        toast.success("Registered successfully", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        navigate("/login");
      })
      .catch((err) => {
        const outpt = err.response.data.message;
        toast.error(outpt, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      });
  };

  return (
    <div className="registerOutter">
      <Navbar />
      <div className="register">
        <h1 className="registerh1">Register</h1>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="form">
              <div>
                <div className="name">
                  <div className="firstName">
                    <label htmlFor="firstName" className="label">
                      First Name:
                    </label>
                    <Field
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Enter your first name"
                    />
                    <ErrorMessage
                      name="firstName"
                      component="div"
                      className="error"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="label">
                      Last Name:
                    </label>
                    <Field
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                    />
                    <ErrorMessage
                      name="lastName"
                      component="div"
                      className="error"
                    />
                  </div>
                </div>

                <label htmlFor="email" className="label">
                  Email:
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                />
                <ErrorMessage name="email" component="div" className="error" />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password:
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password:
                </label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="error"
                />
              </div>

              <div>
                <label htmlFor="DOB" className="label">
                  Date of birth:
                </label>
                <Field type="date" id="DOB" name="DOB" />
                <ErrorMessage name="DOB" component="div" className="error" />
              </div>

              <div className="dropdown">
                <label htmlFor="constituency" className="label">
                  Select your constituency:
                </label>
                <Field
                  as="select"
                  name="constituency"
                  id="constituency"
                  className="ddlist"
                >
                  <option value="" selected disabled>
                    Select Constituency
                  </option>
                  <option value="1">Shangri-la-Town</option>
                  <option value="2">Northern-Kunlun-Mountain</option>
                  <option value="3">Western-Shangri-la</option>
                  <option value="4">Naboo-Vallery</option>
                  <option value="5">New-Felucia</option>
                </Field>

                <ErrorMessage
                  name="constituency"
                  component="div"
                  className="error"
                />
              </div>

              <div>
                <label htmlFor="uvccode" className="label">
                  UVC code:
                </label>

                <div className="qr">
                  <Field
                    type="text"
                    id="uvccode"
                    name="uvccode"
                    placeholder="Enter your 8 characters long UVC code"
                  />
                  <img
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXFyLWNvZGUiPjxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHg9IjMiIHk9IjMiIHJ4PSIxIi8+PHJlY3Qgd2lkdGg9IjUiIGhlaWdodD0iNSIgeD0iMTYiIHk9IjMiIHJ4PSIxIi8+PHJlY3Qgd2lkdGg9IjUiIGhlaWdodD0iNSIgeD0iMyIgeT0iMTYiIHJ4PSIxIi8+PHBhdGggZD0iTTIxIDE2aC0zYTIgMiAwIDAgMC0yIDJ2MyIvPjxwYXRoIGQ9Ik0yMSAyMXYuMDEiLz48cGF0aCBkPSJNMTIgN3YzYTIgMiAwIDAgMS0yIDJINyIvPjxwYXRoIGQ9Ik0zIDEyaC4wMSIvPjxwYXRoIGQ9Ik0xMiAzaC4wMSIvPjxwYXRoIGQ9Ik0xMiAxNnYuMDEiLz48cGF0aCBkPSJNMTYgMTJoMSIvPjxwYXRoIGQ9Ik0yMSAxMnYuMDEiLz48cGF0aCBkPSJNMTIgMjF2LTEiLz48L3N2Zz4="
                    alt="qr code scanner"
                    width="30"
                    height="30"
                    onClick={qrdata ? null : handleqrcode}
                  />
                </div>

                <ErrorMessage
                  name="uvccode"
                  component="div"
                  className="error"
                />
                <div id="reader" className="reader"></div>
              </div>

              <div className="signBtn">
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="signupButton"
                  >
                    {isSubmitting ? "Registering..." : "Register"}
                  </button>
                </div>

                <div className="existAcc">
                  <Link className="link" to="../login">
                    Already having an account?
                  </Link>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <Footer />
    </div>
  );
}

export default Register;
