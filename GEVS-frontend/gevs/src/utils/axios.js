import axios from "axios";

const instance =axios.create({
    baseURL: "https://nutty-frog-knickers.cyclic.app/",
    withCredentials: true,
});

export default instance;