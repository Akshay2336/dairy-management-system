import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";



  function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();


const handleRegister = async(e)=>{

e.preventDefault();


try{

const response = await API.post("/auth/register",{

    name,
    email,
    password

});


console.log(response.data);


alert("Registration Successful");
navigate("/login");



}
catch(error){

console.log(error.response.data);

alert("Registration Failed");

}


};

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white w-full max-w-md p-6 md:p-8 rounded-xl shadow-lg">


        <h1 className="text-2xl md:text-3xl font-bold text-center text-green-700 mb-6">
          Dairy Management
        </h1>

        <h2 className="text-xl font-semibold text-center mb-6">
          Create Account
        </h2>


        <form 
          onSubmit={handleRegister}
          className="space-y-4"
        >


          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
          />


          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
          />


          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
          />


          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition"
          >
            Register
          </button>


        </form>


        <p className="text-center mt-5 text-gray-600">
          Already have an account?
          <Link  to = "/login" className="text-green-600 cursor-pointer ml-1">
            Login
          </Link>
        </p>


      </div>

    </div>

  );
}


export default Register;