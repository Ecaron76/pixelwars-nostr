
import React from 'react';

const InputAnswer = ({ answer, setAnswer, onSubmit }) => {
  const handleInputChange = (e) => {
    setAnswer(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer) {
      onSubmit(answer);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          User name:
          <input 
            type="text" 
            value={answer} 
            onChange={handleInputChange} 
            placeholder="enter your answer" 
          />
        </label>
        <button type="submit">try it</button>
      </form>
    </div>
  );
};

export default InputAnswer;
