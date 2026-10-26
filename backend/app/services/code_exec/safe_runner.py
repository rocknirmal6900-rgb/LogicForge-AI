import os
import sys
import time
import shutil
import tempfile
import subprocess
from typing import Dict, Any, List, Optional
from app.core.config import settings

class SafeCodeRunner:
    def __init__(self):
        self.timeout = settings.EXECUTION_TIMEOUT_SECONDS
        self.max_output_bytes = settings.MAX_OUTPUT_BYTES

    def _get_sanitized_env(self) -> Dict[str, str]:
        """Strip all sensitive API keys and secrets from child process environment."""
        safe_keys = ["PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP"]
        return {k: v for k, v in os.environ.items() if k.upper() in safe_keys}

    def execute_python(self, code: str, stdin: str = "") -> Dict[str, Any]:
        """Execute Python code in an isolated subprocess with strict timeouts and stripped env."""
        temp_dir = tempfile.mkdtemp(prefix="logicforge_py_")
        script_path = os.path.join(temp_dir, "solution.py")

        try:
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Isolated Python flags:
            # -I : isolated mode (ignores PYTHONPATH and PYTHONHOME, user site packages)
            # -B : don't write .pyc files
            cmd = [sys.executable, "-I", "-B", script_path]
            start_time = time.time()

            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=temp_dir,
                env=self._get_sanitized_env(),
            )

            try:
                stdout, stderr = proc.communicate(input=stdin, timeout=self.timeout)
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
            except subprocess.TimeoutExpired:
                proc.kill()
                stdout, stderr = proc.communicate()
                return {
                    "stdout": stdout[:self.max_output_bytes],
                    "stderr": f"Execution timed out after {self.timeout} seconds. Possible infinite loop.",
                    "exit_code": -1,
                    "execution_time_ms": self.timeout * 1000,
                    "status": "timeout",
                    "is_sandboxed": True,
                }

            # Truncate output to prevent memory DOS
            stdout = stdout[:self.max_output_bytes]
            stderr = stderr[:self.max_output_bytes]

            status = "passed" if proc.returncode == 0 else "runtime_error"
            if "SyntaxError" in stderr or "IndentationError" in stderr:
                status = "syntax_error"

            return {
                "stdout": stdout,
                "stderr": stderr,
                "exit_code": proc.returncode,
                "execution_time_ms": elapsed_ms,
                "status": status,
                "is_sandboxed": True,
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def execute_cpp(self, code: str, stdin: str = "") -> Dict[str, Any]:
        """Compile and execute C++ code using g++ or clang if installed."""
        gpp = shutil.which("g++") or shutil.which("clang++")
        if not gpp:
            return {
                "stdout": "",
                "stderr": "C++ compiler (g++ or clang++) is not installed on this server host. Please configure a C++ compiler or run Python solutions.",
                "exit_code": 127,
                "execution_time_ms": 0,
                "status": "sandbox_disabled",
                "is_sandboxed": False,
            }

        temp_dir = tempfile.mkdtemp(prefix="logicforge_cpp_")
        src_path = os.path.join(temp_dir, "solution.cpp")
        bin_name = "solution.exe" if os.name == "nt" else "solution"
        bin_path = os.path.join(temp_dir, bin_name)

        try:
            with open(src_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Compile step
            compile_res = subprocess.run(
                [gpp, "-O2", "-std=c++17", src_path, "-o", bin_path],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=temp_dir,
            )

            if compile_res.returncode != 0:
                return {
                    "stdout": "",
                    "stderr": compile_res.stderr[:self.max_output_bytes],
                    "exit_code": compile_res.returncode,
                    "execution_time_ms": 0,
                    "status": "syntax_error",
                    "is_sandboxed": True,
                }

            # Run step
            start_time = time.time()
            proc = subprocess.Popen(
                [bin_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=temp_dir,
                env=self._get_sanitized_env(),
            )

            try:
                stdout, stderr = proc.communicate(input=stdin, timeout=self.timeout)
                elapsed_ms = round((time.time() - start_time) * 1000, 2)
            except subprocess.TimeoutExpired:
                proc.kill()
                return {
                    "stdout": "",
                    "stderr": f"Execution timed out after {self.timeout} seconds.",
                    "exit_code": -1,
                    "execution_time_ms": self.timeout * 1000,
                    "status": "timeout",
                    "is_sandboxed": True,
                }

            return {
                "stdout": stdout[:self.max_output_bytes],
                "stderr": stderr[:self.max_output_bytes],
                "exit_code": proc.returncode,
                "execution_time_ms": elapsed_ms,
                "status": "passed" if proc.returncode == 0 else "runtime_error",
                "is_sandboxed": True,
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def run_test_cases(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Run code against multiple test cases and return passed/failed analysis."""
        all_passed = True
        test_results = []
        total_time = 0.0

        for tc in test_cases:
            tc_input = tc.get("input", "")
            expected = tc.get("expected_output", "").strip()

            if language == "python":
                res = self.execute_python(code, stdin=tc_input)
            elif language == "cpp":
                res = self.execute_cpp(code, stdin=tc_input)
            else:
                res = self.execute_python(code, stdin=tc_input)

            actual = res.get("stdout", "").strip()
            total_time += res.get("execution_time_ms", 0)

            # Compare trimmed output
            passed = (res.get("exit_code") == 0) and (actual == expected)
            if not passed:
                all_passed = False

            test_results.append({
                "test_case_id": tc.get("id", 0),
                "passed": passed,
                "input": tc_input if not tc.get("is_hidden") else "[Hidden Test Case]",
                "expected": expected if not tc.get("is_hidden") else "[Hidden]",
                "actual": actual if not tc.get("is_hidden") else ("[Output matched]" if passed else "[Output mismatch]"),
            })

            # If syntax error or timeout, break early
            if res.get("status") in ["syntax_error", "timeout", "sandbox_disabled"]:
                return {
                    "stdout": res.get("stdout", ""),
                    "stderr": res.get("stderr", ""),
                    "exit_code": res.get("exit_code", 1),
                    "execution_time_ms": total_time,
                    "status": res.get("status"),
                    "test_results": test_results,
                    "is_sandboxed": res.get("is_sandboxed", True),
                }

        return {
            "stdout": f"All {len(test_cases)} test cases passed!" if all_passed else f"{sum(1 for t in test_results if t['passed'])}/{len(test_cases)} passed.",
            "stderr": "",
            "exit_code": 0 if all_passed else 1,
            "execution_time_ms": total_time,
            "status": "passed" if all_passed else "failed",
            "test_results": test_results,
            "is_sandboxed": True,
        }

code_runner = SafeCodeRunner()
